export async function calculateQueue(payload) {
  const res = await fetch(
    `https://diagnostic-lab-simulator-production.up.railway.app/api/queue/calculate`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    },
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Request failed with status ${res.status}`);
  }

  return res.json();
}
