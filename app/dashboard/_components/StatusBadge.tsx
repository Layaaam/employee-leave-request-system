import { Badge } from '@/components/ui/badge'

const VALID_STATUSES = ['pending', 'approved', 'rejected', 'cancelled'] as const

export default function StatusBadge({ status }: { status: string }) {
  const variant = (VALID_STATUSES as readonly string[]).includes(status)
    ? (status as (typeof VALID_STATUSES)[number])
    : 'cancelled'

  return (
    <Badge variant={variant} className="capitalize">
      {status}
    </Badge>
  )
}
