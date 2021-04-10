import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddResetPassColumns1617933160872 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumns('users', [
      new TableColumn({
        name: 'passwordResetToken',
        type: 'varchar',
        isNullable: true,
      }),

      new TableColumn({
        name: 'passwordResetExpires',
        type: 'timestamp',
        isNullable: true,
      }),
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('users', 'passwordResetToken');
    await queryRunner.dropColumn('users', 'passwordResetExpires');
  }
}
