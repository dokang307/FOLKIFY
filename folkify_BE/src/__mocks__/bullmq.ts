/**
 * Manual mock for bullmq
 * This prevents actual Redis connections during tests
 */

export class Queue {
  name: string;

  constructor(name: string, _options?: any) {
    this.name = name;
  }

  async add(_jobName: string, _data: any, _options?: any) {
    return { id: 'mock-job-id' };
  }

  async count() {
    return 0;
  }

  async close() {
    return;
  }

  on(_event: string, _handler: Function) {
    return this;
  }
}

export class Worker {
  constructor(_queueName: string, _processor: Function, _options?: any) {
    // Mock worker
  }

  async close() {
    return;
  }

  on(_event: string, _handler: Function) {
    return this;
  }
}
