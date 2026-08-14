import axios from 'axios';

const PROBE_BYTES = 512 * 1024;
const MAX_RESPONSE_BYTES = 8 * 1024 * 1024;

const VIDEO_SAMPLE_ENTRIES = new Set([
  'avc1',
  'avc3',
  'hvc1',
  'hev1',
  'av01',
  'bvc1',
  'bvc2',
  'bytevc1',
  'bytevc2',
]);

const PHOTOS_COMPATIBLE_CODECS = new Set(['avc1', 'avc3', 'hvc1', 'hev1']);
const AUDIO_SAMPLE_ENTRIES = new Set([
  'mp4a',
  'ac-3',
  'ec-3',
  'Opus',
  'alaw',
  'ulaw',
  'samr',
  'sawb',
  'lpcm',
]);

const CONTAINER_TYPES = new Set([
  'moov',
  'trak',
  'mdia',
  'minf',
  'stbl',
  'edts',
  'dinf',
  'mvex',
  'moof',
  'traf',
  'mfra',
]);

function readBox(buffer, offset, end) {
  if (offset + 8 > end) return null;

  let size = buffer.readUInt32BE(offset);
  let headerSize = 8;
  if (size === 1) {
    if (offset + 16 > end) return null;
    const largeSize = buffer.readBigUInt64BE(offset + 8);
    if (largeSize > BigInt(Number.MAX_SAFE_INTEGER)) return null;
    size = Number(largeSize);
    headerSize = 16;
  } else if (size === 0) {
    size = end - offset;
  }

  if (size < headerSize || offset + size > end) return null;
  return {
    type: buffer.toString('ascii', offset + 4, offset + 8),
    dataStart: offset + headerSize,
    end: offset + size,
  };
}

function readFtypCodec(buffer) {
  const ftyp = readBox(buffer, 0, buffer.length);
  if (!ftyp || ftyp.type !== 'ftyp') return null;

  const brands = [];
  for (let offset = ftyp.dataStart; offset + 4 <= ftyp.end; offset += 4) {
    brands.push(buffer.toString('ascii', offset, offset + 4));
  }
  return brands.find((brand) => VIDEO_SAMPLE_ENTRIES.has(brand)) || null;
}

function findStsdBoxes(buffer, start, end, result = []) {
  let offset = start;
  while (offset + 8 <= end) {
    const box = readBox(buffer, offset, end);
    if (!box) break;

    if (box.type === 'stsd') {
      result.push(box);
    } else if (CONTAINER_TYPES.has(box.type)) {
      findStsdBoxes(buffer, box.dataStart, box.end, result);
    }
    offset = box.end;
  }
  return result;
}

function readSampleEntries(buffer, stsdBox) {
  if (stsdBox.dataStart + 8 > stsdBox.end) return [];
  const entryCount = buffer.readUInt32BE(stsdBox.dataStart + 4);
  const entries = [];
  let offset = stsdBox.dataStart + 8;

  for (let index = 0; index < entryCount && offset + 8 <= stsdBox.end; index += 1) {
    const entry = readBox(buffer, offset, stsdBox.end);
    if (!entry) break;
    entries.push(entry.type);
    offset = entry.end;
  }
  return entries;
}

export function detectMp4VideoCodec(input) {
  if (!input) return null;
  const buffer = Buffer.isBuffer(input) ? input : Buffer.from(input);
  if (buffer.length < 16) return null;

  const ftypCodec = readFtypCodec(buffer);
  const entries = findStsdBoxes(buffer, 0, buffer.length)
    .flatMap((box) => readSampleEntries(buffer, box));
  const videoEntry = entries.find((entry) => (
    VIDEO_SAMPLE_ENTRIES.has(entry) && !AUDIO_SAMPLE_ENTRIES.has(entry)
  ));
  return videoEntry || ftypCodec || null;
}

export function isPhotosCompatibleVideoCodec(codec) {
  return PHOTOS_COMPATIBLE_CODECS.has(String(codec || '').toLowerCase());
}

export async function probeVideoCodec(url, options = {}) {
  if (!url) return null;

  try {
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      timeout: options.timeout || 15000,
      maxContentLength: MAX_RESPONSE_BYTES,
      maxBodyLength: MAX_RESPONSE_BYTES,
      headers: {
        Range: 'bytes=0-' + (PROBE_BYTES - 1),
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
        Referer: 'https://www.douyin.com/',
      },
      validateStatus: (status) => status === 200 || status === 206,
    });

    const buffer = Buffer.from(response.data).subarray(0, PROBE_BYTES);
    const codec = detectMp4VideoCodec(buffer);
    if (!codec) return null;
    return { codec };
  } catch (error) {
    return null;
  }
}

