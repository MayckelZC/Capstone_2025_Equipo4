import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import {
  LazyLoadDirective,
  LazyContentDirective,
  OptimizedImageDirective,
  ThrottleDirective,
  DebounceDirective,
  PreloadDirective
} from './performance.directives';

@NgModule({
  declarations: [
    LazyLoadDirective,
    LazyContentDirective,
    OptimizedImageDirective,
    ThrottleDirective,
    DebounceDirective,
    PreloadDirective
  ],
  imports: [
    CommonModule
  ],
  exports: [
    LazyLoadDirective,
    LazyContentDirective,
    OptimizedImageDirective,
    ThrottleDirective,
    DebounceDirective,
    PreloadDirective
  ]
})
export class PerformanceDirectivesModule { }