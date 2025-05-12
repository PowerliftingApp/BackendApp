import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { TrainingPlan, TrainingPlanDocument } from './schemas/training-plan.schema';
import { CreateTrainingPlanDto } from './dto/create-training-plan.dto';
import { UpdateTrainingPlanDto } from './dto/update-training-plan.dto';

@Injectable()
export class TrainingPlansService {
  constructor(
    @InjectModel(TrainingPlan.name)
    private trainingPlanModel: Model<TrainingPlanDocument>,
  ) {}

  async create(createTrainingPlanDto: CreateTrainingPlanDto): Promise<TrainingPlan> {
    const createdPlan = new this.trainingPlanModel(createTrainingPlanDto);
    return createdPlan.save();
  }

  async findAll(): Promise<TrainingPlan[]> {
    return this.trainingPlanModel.find().exec();
  }

  async findOne(id: string): Promise<TrainingPlan> {
    const plan = await this.trainingPlanModel.findById(id).exec();
    if (!plan) {
      throw new NotFoundException(`Training plan with ID ${id} not found`);
    }
    return plan;
  }

  async findByAthleteId(athleteId: string): Promise<TrainingPlan[]> {
    return this.trainingPlanModel.find({ athleteId }).exec();
  }

  async findByCoachId(coachId: string): Promise<TrainingPlan[]> {
    return this.trainingPlanModel.find({ coachId }).exec();
  }

  async update(id: string, updateTrainingPlanDto: UpdateTrainingPlanDto): Promise<TrainingPlan> {
    const updatedPlan = await this.trainingPlanModel
      .findByIdAndUpdate(id, updateTrainingPlanDto, { new: true })
      .exec();
    if (!updatedPlan) {
      throw new NotFoundException(`Training plan with ID ${id} not found`);
    }
    return updatedPlan;
  }

  async remove(id: string): Promise<void> {
    const result = await this.trainingPlanModel.deleteOne({ _id: id }).exec();
    if (result.deletedCount === 0) {
      throw new NotFoundException(`Training plan with ID ${id} not found`);
    }
  }
}
