import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ArticleService } from '../../../services/article.service';
import { ToastService } from '../../../services/toast.service';
import { Article } from '../../../models/Article';

@Component({
  selector: 'app-create-article',
  templateUrl: './create-article.page.html',
  styleUrls: ['./create-article.page.scss'],
})
export class CreateArticlePage implements OnInit {

  article: Partial<Article> = {};
  articleId: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private articleService: ArticleService,
    private toastService: ToastService
  ) { }

  ngOnInit() {
    this.articleId = this.route.snapshot.paramMap.get('id');
    if (this.articleId) {
      this.articleService.getArticle(this.articleId).subscribe(article => {
        if (article) {
          this.article = article;
        }
      });
    }
  }

  saveArticle() {
    if (this.articleId) {
      this.articleService.updateArticle(this.articleId, this.article).then(() => {
        this.toastService.presentToast('Artículo actualizado', 'success', 'checkmark-circle-outline');
        this.router.navigate(['/articles']);
      });
    } else {
      this.articleService.addArticle(this.article as Omit<Article, 'id' | 'createdAt'>).then(() => {
        this.toastService.presentToast('Artículo creado', 'success', 'checkmark-circle-outline');
        this.router.navigate(['/articles']);
      });
    }
  }

}
