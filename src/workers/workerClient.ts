export interface WorkerRequestEnvelope<TPayload> {
  id: number;
  payload: TPayload;
}

export interface WorkerResponseEnvelope<TResult> {
  id: number;
  ok: boolean;
  result?: TResult;
  error?: string;
}

/**
 * Bungkus sebuah Worker menjadi fungsi request() berbasis Promise, dengan
 * korelasi id agar beberapa permintaan bisa berjalan tanpa saling tertukar.
 */
export function createRequestClient<TReq, TRes>(worker: Worker) {
  let counter = 0;
  const pending = new Map<number, { resolve: (v: TRes) => void; reject: (e: unknown) => void }>();

  worker.addEventListener('message', (ev: MessageEvent<WorkerResponseEnvelope<TRes>>) => {
    const { id, ok, result, error } = ev.data;
    const entry = pending.get(id);
    if (!entry) return;
    pending.delete(id);
    if (ok) entry.resolve(result as TRes);
    else entry.reject(new Error(error ?? 'Worker gagal tanpa pesan error'));
  });

  worker.addEventListener('error', (ev) => {
    for (const [id, entry] of pending) {
      entry.reject(new Error(ev.message || 'Worker mengalami error tak terduga'));
      pending.delete(id);
    }
  });

  return function request(payload: TReq): Promise<TRes> {
    const id = ++counter;
    return new Promise<TRes>((resolve, reject) => {
      pending.set(id, { resolve, reject });
      worker.postMessage({ id, payload } satisfies WorkerRequestEnvelope<TReq>);
    });
  };
}

/**
 * Dipakai di dalam file worker: dengarkan pesan request dan balas dengan
 * hasil handler, membungkus error agar tidak membuat worker mati diam-diam.
 */
export function handleWorkerRequests<TReq, TRes>(handler: (payload: TReq) => TRes | Promise<TRes>): void {
  const ctx = self as unknown as Worker;
  ctx.onmessage = async (ev: MessageEvent<WorkerRequestEnvelope<TReq>>) => {
    const { id, payload } = ev.data;
    try {
      const result = await handler(payload);
      ctx.postMessage({ id, ok: true, result } satisfies WorkerResponseEnvelope<TRes>);
    } catch (err) {
      ctx.postMessage({
        id,
        ok: false,
        error: err instanceof Error ? err.message : String(err),
      } satisfies WorkerResponseEnvelope<TRes>);
    }
  };
}
