export const View = ({ active }) => (
  <div
    className="text-white flex p-2"
    data-ui={active ? 'bg-red m-2' : 'opacity-0 absolute'}
  />
)
