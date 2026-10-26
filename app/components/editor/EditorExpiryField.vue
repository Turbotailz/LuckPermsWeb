<script setup lang="ts">
import type { DateValue } from '@internationalized/date'
import { toCalendarDate } from '@internationalized/date'
import {
  calendarDateTimeFromParts,
  dateValueToTimestamp,
  nowCalendarDateTime,
  timestampToCalendarDateTime
} from '~/utils/date'

const props = withDefaults(defineProps<{
  modelValue?: number | null
  size?: 'xs' | 'sm' | 'md'
  inlineCalendar?: boolean
}>(), {
  size: 'sm'
})

const emit = defineEmits<{
  'update:modelValue': [value: number | null]
}>()

const { t } = useI18n()

const date = computed({
  get() {
    return props.modelValue ? timestampToCalendarDateTime(props.modelValue) : undefined
  },
  set(value: DateValue | null | undefined) {
    if (!value) {
      emit('update:modelValue', null)
      return
    }
    // The field is minute granularity, but the placeholder carries the current
    // seconds. Drop them so 18:30 is stored as 18:30:00, not 18:30:08.
    const hour = 'hour' in value ? value.hour : 0
    const minute = 'minute' in value ? value.minute : 0
    emit('update:modelValue', dateValueToTimestamp(calendarDateTimeFromParts(value, hour, minute)))
  }
})

const calendarDate = computed({
  get() {
    return date.value ? toCalendarDate(date.value) : undefined
  },
  set(value: DateValue | null | undefined) {
    if (!value) {
      return
    }
    const current = date.value
    date.value = calendarDateTimeFromParts(value, current?.hour ?? 0, current?.minute ?? 0)
  }
})

const placeholder = nowCalendarDateTime()
</script>

<template>
  <div class="space-y-3">
    <div class="flex items-center gap-1.5">
      <UInputDate
        v-model="date"
        granularity="minute"
        :hour-cycle="24"
        :size="size"
        :placeholder="placeholder"
        class="min-w-0 flex-1"
      >
        <template v-if="!inlineCalendar" #trailing>
          <UPopover>
            <UButton
              color="neutral"
              variant="link"
              size="sm"
              icon="i-lucide-calendar-days"
              :aria-label="t('editor.nodes.expiry')"
              class="min-h-6 min-w-6"
            />
            <template #content>
              <UCalendar v-model="calendarDate" class="p-2" />
            </template>
          </UPopover>
        </template>
      </UInputDate>
      <UButton
        v-if="modelValue"
        color="neutral"
        variant="ghost"
        size="xs"
        icon="i-lucide-x"
        :aria-label="t('editor.nodes.deleteExpiry')"
        @click="date = undefined"
      />
    </div>
    <UCalendar v-if="inlineCalendar" v-model="calendarDate" />
  </div>
</template>
