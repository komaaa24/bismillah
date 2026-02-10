import { DataSource, DataSourceOptions } from 'typeorm';
import { config } from '../config';
import * as entities from './entities';

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  url: config.POSTGRES_URI,
  entities: Object.values(entities).filter((entity) => typeof entity === 'function'),
  synchronize: config.NODE_ENV !== 'production',
  logging: false,
  migrations: [__dirname + '/migrations/**/*{.ts,.js}'],
  ssl: false,
};

export const AppDataSource = new DataSource(dataSourceOptions);
