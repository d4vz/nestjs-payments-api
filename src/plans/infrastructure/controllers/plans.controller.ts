import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  Inject,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { CreatePlanDto } from '../../application/dtos/create-plan.dto';
import { UpdatePlanDto } from '../../application/dtos/update-plan.dto';
import {
  IPlanService,
  PLAN_SERVICE,
} from '../../domain/services/plan.service.interface';
import { JwtAuthGuard } from '../../../auth/infrastructure/guards/jwt-auth.guard';
import { Roles } from '../../../auth/infrastructure/decorators/roles.decorator';
import { Role } from '../../../auth/domain/enums/role.enum';
import { RolesGuard } from '../../../auth/infrastructure/guards/roles.guard';

@Controller('plans')
export class PlansController {
  constructor(
    @Inject(PLAN_SERVICE)
    private readonly planService: IPlanService,
  ) {}

  @Get()
  async findAll() {
    return this.planService.findAll();
  }

  @Get('active')
  async findActive() {
    return this.planService.findActive();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const plan = await this.planService.findById(id);
    if (!plan) {
      throw new HttpException('Plan not found', HttpStatus.NOT_FOUND);
    }
    return plan;
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async create(@Body() createPlanDto: CreatePlanDto) {
    return this.planService.create(createPlanDto);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async update(@Param('id') id: string, @Body() updatePlanDto: UpdatePlanDto) {
    return this.planService.update(id, updatePlanDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async remove(@Param('id') id: string) {
    const deleted = await this.planService.delete(id);
    if (!deleted) {
      throw new HttpException(
        'Failed to delete plan',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
    return { message: 'Plan deleted successfully' };
  }

  @Put(':id/activate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async activate(@Param('id') id: string) {
    return this.planService.activate(id);
  }

  @Put(':id/deactivate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async deactivate(@Param('id') id: string) {
    return this.planService.deactivate(id);
  }
}
