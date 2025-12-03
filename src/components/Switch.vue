<script setup>
const props = defineProps(['modelValue']);
const emit = defineEmits(['update:modelValue']);

const toggle = () => {
    emit('update:modelValue', !props.modelValue);
};
</script>

<template>
    <button @click="toggle"
        class="relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none"
        :class="modelValue ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'">
        <span class="inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform"
            :class="modelValue ? 'translate-x-6' : 'translate-x-1'" />
    </button>
</template>