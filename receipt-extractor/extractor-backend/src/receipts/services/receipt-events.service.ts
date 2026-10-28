import { Injectable } from '@nestjs/common';
import { Subject, Observable } from 'rxjs';
import { filter } from 'rxjs/operators';

export interface ReceiptEvent {
  userId: string;
  receiptId: string;
  status: string;
}

/**
 * In-process event bus for receipt extraction updates.
 * The extraction processor emits events here; the SSE controller
 * subscribes per-user and streams them to the browser.
 */
@Injectable()
export class ReceiptEventsService {
  private readonly events$ = new Subject<ReceiptEvent>();

  /** Publish a receipt status change */
  emit(event: ReceiptEvent): void {
    this.events$.next(event);
  }

  /** Get an observable filtered to a single user's events */
  subscribe(userId: string): Observable<ReceiptEvent> {
    return this.events$
      .asObservable()
      .pipe(filter((event) => event.userId === userId));
  }
}
