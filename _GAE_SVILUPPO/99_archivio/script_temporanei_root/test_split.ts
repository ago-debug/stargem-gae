import { addMinutes, parse, format, differenceInMinutes } from 'date-fns';

function generateSlots(start: string, end: string) {
  const slots: string[] = [];
  let current = start;
  while (current < end) {
    slots.push(current);
    const date = parse(current, 'HH:mm', new Date());
    current = format(addMinutes(date, 30), 'HH:mm');
  }
  return slots;
}

function groupToBlocks(slots: string[]) {
  if (slots.length === 0) return [];
  slots.sort();
  const blocks = [];
  let blockStart = slots[0];
  let currentEnd = format(addMinutes(parse(blockStart, 'HH:mm', new Date()), 30), 'HH:mm');

  for (let i = 1; i < slots.length; i++) {
    if (slots[i] === currentEnd) {
      currentEnd = format(addMinutes(parse(slots[i], 'HH:mm', new Date()), 30), 'HH:mm');
    } else {
      blocks.push({ start: blockStart, end: currentEnd });
      blockStart = slots[i];
      currentEnd = format(addMinutes(parse(slots[i], 'HH:mm', new Date()), 30), 'HH:mm');
    }
  }
  blocks.push({ start: blockStart, end: currentEnd });
  return blocks;
}

console.log(groupToBlocks(['09:00', '09:30', '10:30', '11:00', '11:30']));
