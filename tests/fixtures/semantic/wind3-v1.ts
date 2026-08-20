/**
 * Observable outputs captured from the default semantic protocol in v0.1.0
 */
export const WIND3_V1_COMPATIBILITY_FIXTURES = [
  {
    expected:
      'overflow-hidden absolute flex table-row flex-1 grid-cols-2 items-center p-2 w-2 text-sm bg-red mask-cover border divide-solid opacity-50 blur rotate-1 duration-200 animate-spin appearance-none cursor-pointer i-home fill-red sr-only',
    input:
      'sr-only fill-red i-home cursor-pointer appearance-none animate-spin duration-200 rotate-1 blur opacity-50 divide-solid border mask-cover bg-red text-sm w-2 p-2 items-center grid-cols-2 flex-1 table-row flex absolute overflow-hidden',
    name: 'built-in utility families',
  },
  {
    expected:
      'text-white component-a flex p-2 sm:grid hover:bg-red component-b opacity-50',
    input:
      'text-white component-a p-2 flex sm:grid hover:bg-red component-b opacity-50',
    name: 'variants and pinned unknown partitions',
  },
  {
    expected: 'flex -m-1 !p-2 p-3! text-sm',
    input: 'text-sm !p-2 flex -m-1 p-3!',
    name: 'negative and important utilities',
  },
  {
    expected: '  flex  p-2\ttext-white\n\tabsolute bg-red  ',
    input: '  text-white  flex\tp-2\n\tbg-red absolute  ',
    name: 'whitespace and newline partitions',
  },
] as const
