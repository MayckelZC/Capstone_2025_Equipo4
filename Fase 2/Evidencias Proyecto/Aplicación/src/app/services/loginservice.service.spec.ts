import { TestBed } from '@angular/core/testing';
import { TestProvidersModule } from 'src/test-helpers/test-providers.module';

import { LoginService } from './loginservice.service';

describe('LoginService', () => {
  let service: LoginService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [TestProvidersModule]
    });
    service = TestBed.inject(LoginService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
