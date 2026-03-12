const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export async function calculateQueue(payload) {
  const res = await fetch(`${API_BASE}/api/queue/calculate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Request failed with status ${res.status}`);
  }

  return res.json();
}
