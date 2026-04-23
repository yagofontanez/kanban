export const uid = (prefix = '') => {
  const rand = Math.random().toString(36).slice(2, 9)
  const time = Date.now().toString(36)
  return `${prefix}${prefix ? '_' : ''}${time}${rand}`
}
