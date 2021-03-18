import { Logger, NotFoundException } from "@nestjs/common";
import { Connection, getConnection, getConnectionManager, getRepository, Repository, SelectQueryBuilder } from "typeorm";
import { QueryDeepPartialEntity } from "typeorm/query-builder/QueryPartialEntity";

export class BaseService<T> {
    
    protected logger: Logger

  constructor(
    private TClass: { new(): T },
  ) {
    this.logger = new Logger('Base service');
  }

  getConnection(): Connection {
    return getConnection(process.env.CONNECTION_NAME)
  }

  getRepository(): Repository<T> {
    return this.getConnection().getRepository(this.TClass)
  }

  private findQuery(where: WhereParams, select?: (keyof T)[]): SelectQueryBuilder<T> {
    let whereCondition: string = ''
    if (where) {
      for (let key in where) {
        if (whereCondition.length > 0) {
          whereCondition += ' AND '
        }
        whereCondition += `${key} = :${key}`
      }
    }
    let query: SelectQueryBuilder<T> = this.getRepository()
      .createQueryBuilder()
      .select()
      .where(whereCondition, where)
    if (select && select.length) {
      for (let s of select) {
        query.addSelect(`"${this.TClass.name}"."${s.toString()}"`, `${this.TClass.name}_${s}`)
      }
    }
    return query
  }

  async find(where: WhereParams, select?: (keyof T)[]): Promise<T[]> {
    let query = this.findQuery(where, select)
    return query.getMany()
  }

  async findOne(where: WhereParams, select?: (keyof T)[]): Promise<T> {
    let query = this.findQuery(where, select)
    return query.getOne()
  }

  async findOneById(id: number, select?: (keyof T)[]) {
    return await this.findOne({ id: id }, select)
  }

  async findOneOrFail(params: WhereParams, select?: (keyof T)[]): Promise<T> {
    let entity = await this.findOne(params, select)
    if (!entity) {
      this.logger.log('Entity not found')
      this.logger.log(JSON.stringify(params || {}))
      this.logger.log(Error().stack)
      throw new NotFoundException();
    } else {
      return entity;
    }
  }

  async updateFields(id: number, values: QueryDeepPartialEntity<T>) {
    return await this.getConnection().manager.update(
      this.TClass,
      { id },
      values
    )
  }

  async save(value: T) {
    return await this.getConnection().manager.save(value)
  }

  async createEntity() {
    return await this.getConnection().manager.create(this.TClass);
  }

  async delete (where: WhereParams) {
    return await this.getConnection().manager.delete(
      this.TClass,
      where
    )
  }

}

export class WhereParams {
  [key: string]: any
}