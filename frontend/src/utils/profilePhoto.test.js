import { getProfilePhotoUrl } from './profilePhoto';

describe('getProfilePhotoUrl', () => {
  it('resolves relative backend URLs against the API base', () => {
    expect(getProfilePhotoUrl('/media/123', 'https://api.example.com')).toBe('https://api.example.com/media/123');
  });

  it('returns absolute URLs unchanged', () => {
    expect(getProfilePhotoUrl('https://cdn.example.com/avatar.png', 'https://api.example.com')).toBe('https://cdn.example.com/avatar.png');
  });
});
