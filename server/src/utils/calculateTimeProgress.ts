function calculateTimeProgress(startDate: string, dueDate: string): number {
  const now = new Date();
  const start = new Date(startDate);
  const due = new Date(dueDate);

  if (now < start) return 0; // Task hasn't started yet
  if (now > due) return 100; // Task is overdue or completed

  const totalTime = due.getTime() - start.getTime();
  const elapsedTime = now.getTime() - start.getTime();

  return Math.round((elapsedTime / totalTime) * 100);
}

export default calculateTimeProgress;
