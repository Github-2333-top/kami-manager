export async function readFromClipboard(): Promise<string> {
  try {
    const text = await navigator.clipboard.readText()
    return text
  } catch (error) {
    console.error('Failed to read from clipboard:', error)
    throw new Error('无法读取剪贴板内容，请确保已授予剪贴板权限')
  }
}

export async function writeToClipboard(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text)
  } catch (error) {
    console.error('Failed to write to clipboard:', error)
    throw new Error('无法写入剪贴板')
  }
}

export function parseCardCodes(text: string): string[] {
  return text
    .split(/[\n\r]+/)
    .map(line => line.trim())
    .filter(line => line.length > 0)
}

