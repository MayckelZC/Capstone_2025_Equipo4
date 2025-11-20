import { Component, OnInit } from '@angular/core';
import { ArticleService } from '../../services/article.service';
import { Article } from '../../models/Article';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-articles',
  templateUrl: './articles.page.html',
  styleUrls: ['./articles.page.scss'],
})
export class ArticlesPage implements OnInit {

  articles: Article[] = [];

  constructor(private articleService: ArticleService, public authService: AuthService) { }

  ngOnInit() {
    this.articleService.getArticles().subscribe(articles => {
      this.articles = articles;
    });
  }

}
