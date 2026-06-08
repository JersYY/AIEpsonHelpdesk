export const formatStatus = (status) => {
    if (!status) return ''
    const s = status.toUpperCase()
    if (s === 'IN_PROGRESS') return 'PROGRESS'
    if (s === 'OPEN') return 'OPEN'
    if (s === 'RESOLVED') return 'RESOLVED'
    if (s === 'CLOSED') return 'CLOSED'
    return s.replace(/_/g, ' ')
}

export const formatPriority = (priority) => {
    if (!priority) return ''
    return priority.charAt(0).toUpperCase() + priority.slice(1).toLowerCase()
}
