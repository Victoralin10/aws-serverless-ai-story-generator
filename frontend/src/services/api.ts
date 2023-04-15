const API_BASE_URL = '/api'; // Replace with the actual API base URL

export async function getStory(id: string): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/story/${id}`);
  const data = await response.json();
  return data;
}

export async function subscribe(email: string) {
  const response = await fetch(`${API_BASE_URL}/subscribe`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email }),
  });
  return response;
}

export async function addScene(description: string) {
  const response = await fetch(`${API_BASE_URL}/scene`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ description }),
  });
  return response;
}
