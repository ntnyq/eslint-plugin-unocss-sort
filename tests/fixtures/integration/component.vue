<template>
  <Transition appear-active-class="text-white flex duration-200" />
  <div
    class="bg-red p-2 flex"
    :class="[
      'opacity-0 absolute',
      active ? 'm-2 block' : 'text-white grid',
    ]"
  />
</template>
