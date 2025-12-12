import { TestBed } from '@angular/core/testing';
import { TestProvidersModule } from '../../../../test-helpers/test-providers.module';

import { UserService } from './user.service';

describe('UserService', () => {
  let service: UserService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [TestProvidersModule]
    });
    service = TestBed.inject(UserService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
