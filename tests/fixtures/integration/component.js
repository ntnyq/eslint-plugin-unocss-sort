export const clsRoot = 'text-white flex p-4'
export const view = clsx(
  'bg-red p-2',
  { 'opacity-0 absolute': hidden },
  ['text-sm grid', enabled && 'm-2 block'],
)
