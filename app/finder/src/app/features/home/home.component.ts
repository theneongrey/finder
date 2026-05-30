import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Button } from 'primeng/button';
import { NgOptimizedImage } from '@angular/common';
import { RouterLink } from '@angular/router';
import { BackgroundAnimationComponent } from '../../common/ui/components/background-animation/background-animation.component';

@Component({
  selector: 'app-home',
  imports: [Button, NgOptimizedImage, RouterLink, BackgroundAnimationComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent {}
