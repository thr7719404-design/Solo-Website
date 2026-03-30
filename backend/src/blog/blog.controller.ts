import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { BlogService } from './blog.service';
import { CreateBlogPostDto, UpdateBlogPostDto, CreateBlogCategoryDto, UpdateBlogCategoryDto, CreateBlogTagDto } from './dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('blog')
export class BlogController {
  constructor(private readonly blogService: BlogService) {}

  // ============================================================================
  // STOREFRONT ENDPOINTS (Public)
  // ============================================================================

  @Get()
  async getPosts(
    @Query('categoryId') categoryId?: string,
    @Query('tagId') tagId?: string,
    @Query('featured') featured?: string,
    @Query('limit') limit?: string,
    @Query('page') page?: string,
  ) {
    return this.blogService.getAllPosts({
      categoryId,
      tagId,
      isFeatured: featured === 'true' ? true : undefined,
      limit: limit ? parseInt(limit, 10) : 10,
      page: page ? parseInt(page, 10) : 1,
    });
  }

  @Get('sidebar')
  async getSidebar() {
    return this.blogService.getSidebarData();
  }

  @Get('recent')
  async getRecentPosts(@Query('limit') limit?: string) {
    return this.blogService.getRecentPosts(limit ? parseInt(limit, 10) : 5);
  }

  @Get('post/:slug')
  async getPostBySlug(@Param('slug') slug: string) {
    return this.blogService.getPostBySlug(slug);
  }

  // ============================================================================
  // ADMIN ENDPOINTS (Protected)
  // ============================================================================

  @Get('admin/posts')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async getAllPostsAdmin(
    @Query('categoryId') categoryId?: string,
    @Query('limit') limit?: string,
    @Query('page') page?: string,
  ) {
    return this.blogService.getAllPosts({
      categoryId,
      limit: limit ? parseInt(limit, 10) : 20,
      page: page ? parseInt(page, 10) : 1,
      includeInactive: true,
    });
  }

  @Get('admin/posts/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async getPostAdmin(@Param('id') id: string) {
    return this.blogService.getPost(id);
  }

  @Post('admin/posts')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async createPost(@Body() dto: CreateBlogPostDto) {
    return this.blogService.createPost(dto);
  }

  @Patch('admin/posts/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async updatePost(@Param('id') id: string, @Body() dto: UpdateBlogPostDto) {
    return this.blogService.updatePost(id, dto);
  }

  @Delete('admin/posts/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async deletePost(@Param('id') id: string) {
    return this.blogService.deletePost(id);
  }

  // Categories
  @Get('categories')
  async getCategories() {
    return this.blogService.getAllCategories();
  }

  @Get('admin/categories/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async getCategory(@Param('id') id: string) {
    return this.blogService.getCategory(id);
  }

  @Post('admin/categories')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async createCategory(@Body() dto: CreateBlogCategoryDto) {
    return this.blogService.createCategory(dto);
  }

  @Patch('admin/categories/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async updateCategory(@Param('id') id: string, @Body() dto: UpdateBlogCategoryDto) {
    return this.blogService.updateCategory(id, dto);
  }

  @Delete('admin/categories/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async deleteCategory(@Param('id') id: string) {
    return this.blogService.deleteCategory(id);
  }

  // Tags
  @Get('tags')
  async getTags() {
    return this.blogService.getAllTags();
  }

  @Post('admin/tags')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async createTag(@Body() dto: CreateBlogTagDto) {
    return this.blogService.createTag(dto);
  }

  @Delete('admin/tags/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async deleteTag(@Param('id') id: string) {
    return this.blogService.deleteTag(id);
  }
}
