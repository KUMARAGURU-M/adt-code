import { apiCall, saveSession, getCurrentUser, clearSession, refreshCurrentUser, loginUser } from './api';

const login = { userId: 'u1', accessToken: 'access', refreshToken: 'refresh', roles: ['Admin'], profilePhotoUrl: '/media/photo' };
const response = (data) => ({ ok: true, status: 200, text: async () => JSON.stringify({ success: true, data }), json: async () => ({ success: true, data }) });
beforeEach(() => { sessionStorage.clear(); global.fetch = jest.fn(); });
afterEach(() => jest.restoreAllMocks());

test('login preserves credential errors without refreshing an existing admin session', async () => {
  saveSession(login);
  fetch.mockResolvedValue({ ok: false, status: 401, json: async () => ({ success: false, error: 'Invalid credentials' }) });
  await expect(loginUser(' EMP1 ', 'password')).rejects.toThrow('Invalid credentials');
  expect(fetch).toHaveBeenCalledTimes(1);
  expect(getCurrentUser().userId).toBe('u1');
});

test('login identifies HTML server failures by HTTP status', async () => {
  fetch.mockResolvedValue({ ok: false, status: 500, json: async () => { throw new SyntaxError('HTML'); } });
  await expect(loginUser('EMP1', 'password')).rejects.toThrow('HTTP 500');
});

test('login returns the profile and tokens with the password unchanged', async () => {
  fetch.mockResolvedValue(response(login));
  await expect(loginUser(' EMP1 ', ' password ')).resolves.toEqual(login);
  expect(JSON.parse(fetch.mock.calls[0][1].body)).toEqual({ identifier: 'EMP1', password: ' password ' });
});

test.each([524, 504])('reports gateway timeout %s without trying to parse HTML or retrying a mutation', async (status) => {
  const text = jest.fn().mockResolvedValue('<html>Gateway timeout</html>');
  fetch.mockResolvedValue({ ok: false, status, text });
  await expect(apiCall('/auth/impersonate/target', 'POST'))
    .rejects.toThrow(`The server took too long to respond (HTTP ${status})`);
  expect(text).not.toHaveBeenCalled();
  expect(fetch).toHaveBeenCalledTimes(1);
});

test('reports oversized uploads clearly', async () => {
  fetch.mockResolvedValue({ ok: false, status: 413 });
  await expect(apiCall('/media/upload', 'POST', new FormData()))
    .rejects.toThrow('The selected file is too large');
});

test('retains profile photo on login and profile refresh', async () => {
  saveSession(login);
  expect(getCurrentUser().profilePhotoUrl).toBe('/media/photo');
  fetch.mockResolvedValue(response({ ...login, profilePhotoUrl: '/media/new' }));
  await refreshCurrentUser();
  expect(getCurrentUser().profilePhotoUrl).toBe('/media/new');
});

test('writes impersonation to the destination storage without replacing the admin', () => {
  saveSession(login);
  const destination = { setItem: jest.fn() };
  saveSession({ ...login, userId: 'target' }, destination);
  expect(getCurrentUser().userId).toBe('u1');
  expect(destination.setItem).toHaveBeenCalledWith('user', expect.stringContaining('target'));
  sessionStorage.setItem('isImpersonating', 'true');
  clearSession();
  expect(sessionStorage.getItem('isImpersonating')).toBeNull();
});

test('refreshes on HTML 401 and retries multipart upload without JSON content type', async () => {
  saveSession(login);
  const form = new FormData();
  form.append('file', new Blob(['photo'], { type: 'image/png' }), 'photo.png');
  fetch.mockResolvedValueOnce({ status: 401, text: async () => '<html>Unauthorized</html>' })
    .mockResolvedValueOnce(response({ ...login, accessToken: 'new-access' }))
    .mockResolvedValueOnce(response({ url: '/media/new' }));
  await expect(apiCall('/media/upload', 'POST', form)).resolves.toEqual({ url: '/media/new' });
  const retry = fetch.mock.calls[2][1];
  expect(retry.body).toBe(form);
  expect(retry.headers['Content-Type']).toBeUndefined();
  expect(retry.headers.Authorization).toBe('Bearer new-access');
});
