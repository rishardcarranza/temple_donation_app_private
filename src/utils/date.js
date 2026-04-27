export function getCurrentMonth() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

export function formatMonth(month) {
  if (!month) return ''
  const [year, m] = month.split('-')
  const months = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 
                  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
  return `${months[parseInt(m) - 1]}-${year}`
}

export function getYearMonths(year = new Date().getFullYear()) {
  const months = []
  for (let i = 0; i < 12; i++) {
    const month = `${year}-${String(i + 1).padStart(2, '0')}`
    months.push({ value: month, display: formatMonth(month) })
  }
  return months.reverse()
}