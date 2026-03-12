-- Add financial_status column to rides (for existing databases that already ran 001)
alter table public.rides
  add column if not exists financial_status text not null default 'pending'
  check (financial_status in ('pending', 'awaiting_approval', 'awaiting_payment', 'invoiced', 'in_progress', 'completed', 'paid_to_partner'));

create index if not exists idx_rides_financial_status on public.rides (financial_status);
