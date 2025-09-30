import { PermissionsMiddleware } from './permissions.middleware';

describe('PermissionsMiddleware', () => {
  it('should be defined', () => {
    expect(new PermissionsMiddleware()).toBeDefined();
  });
});
