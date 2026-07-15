export const allowedImageTypes = new Map([
  ['image/jpeg', 'jpg'],
  ['image/png', 'png'],
  ['image/webp', 'webp'],
])

export function hasValidImageSignature(type: string, bytes: Uint8Array) {
  if (type === 'image/jpeg') {
    return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff
  }
  if (type === 'image/png') {
    const signature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]
    return bytes.length >= signature.length
      && signature.every((byte, index) => bytes[index] === byte)
  }
  if (type === 'image/webp') {
    if (bytes.length < 12) return false
    return String.fromCharCode(bytes[0], bytes[1], bytes[2], bytes[3]) === 'RIFF'
      && String.fromCharCode(bytes[8], bytes[9], bytes[10], bytes[11]) === 'WEBP'
  }
  return false
}

export function isValidProductImagePath(path: string) {
  return /^products\/[A-Za-z0-9_-]+(?:\/[A-Za-z0-9_-]+)*\.(jpg|jpeg|png|webp)$/.test(path)
}
