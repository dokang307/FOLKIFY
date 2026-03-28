import type { Instrument, Lesson } from "./instruments";

type LessonProgressMap = Record<string, boolean>;
const runtimeProgress: LessonProgressMap = {};

function lessonKey(instrumentId: string, lessonId: string) {
  return `${instrumentId}:${lessonId}`;
}

export function isLessonCompleted(instrumentId: string, lesson: Lesson) {
  if (lesson.completed) return true;
  return Boolean(runtimeProgress[lessonKey(instrumentId, lesson.id)]);
}

export function markLessonCompleted(instrumentId: string, lessonId: string) {
  runtimeProgress[lessonKey(instrumentId, lessonId)] = true;
}

export function getCompletedLessonsCount(instrument: Instrument) {
  return instrument.lessons.filter((lesson) => isLessonCompleted(instrument.id, lesson)).length;
}
