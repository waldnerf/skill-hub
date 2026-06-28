export const CATEGORIES = ['All', 'Data', 'Productivity', 'Communication', 'Strategy']

export const CAT = {
  Data:          { color: '#1a3a8c', bg: '#e8edf9', dot: '#3a5fbf' },
  Productivity:  { color: '#1a6b3a', bg: '#e6f3eb', dot: '#2e9e5a' },
  Communication: { color: '#7a2080', bg: '#f4e8f5', dot: '#a030b0' },
  Strategy:      { color: '#8a3a00', bg: '#f5ece6', dot: '#c05010' },
}

export function getCat(category) {
  return CAT[category] || { color: '#44445a', bg: '#eeeeee', dot: '#7a7a96' }
}
