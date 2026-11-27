package db.migration;

import org.flywaydb.core.api.migration.BaseJavaMigration;
import org.flywaydb.core.api.migration.Context;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.List;

/** Replace the legacy global CNPJ uniqueness with uniqueness per tenant. */
public class V37__fornecedor_cnpj_por_empresa extends BaseJavaMigration {
    @Override
    public void migrate(Context context) throws Exception {
        Connection connection = context.getConnection();
        String schema = connection.getSchema();
        List<String> globalCnpjConstraints = new ArrayList<>();
        String constraintsSql = """
            SELECT tc.constraint_name
            FROM information_schema.table_constraints tc
            JOIN information_schema.key_column_usage kcu
              ON kcu.constraint_schema = tc.constraint_schema
             AND kcu.constraint_name = tc.constraint_name
             AND kcu.table_name = tc.table_name
            WHERE lower(tc.table_schema) = lower(?)
              AND lower(tc.table_name) = 'fornecedor_b2b'
              AND tc.constraint_type = 'UNIQUE'
            GROUP BY tc.constraint_name
            HAVING COUNT(*) = 1
               AND SUM(CASE WHEN lower(kcu.column_name) = 'cnpj' THEN 1 ELSE 0 END) = 1
            """;
        try (PreparedStatement query = connection.prepareStatement(constraintsSql)) {
            query.setString(1, schema);
            try (ResultSet rows = query.executeQuery()) {
                while (rows.next()) globalCnpjConstraints.add(rows.getString(1));
            }
        }

        try (Statement statement = connection.createStatement()) {
            for (String constraint : globalCnpjConstraints) {
                String quoted = "\"" + constraint.replace("\"", "\"\"") + "\"";
                statement.execute("ALTER TABLE fornecedor_b2b DROP CONSTRAINT " + quoted);
            }
        }

        String duplicatesSql = """
            SELECT COUNT(*)
            FROM (
                SELECT empresa_id, cnpj
                FROM fornecedor_b2b
                GROUP BY empresa_id, cnpj
                HAVING COUNT(*) > 1
            ) duplicates
            """;
        try (Statement statement = connection.createStatement(); ResultSet rows = statement.executeQuery(duplicatesSql)) {
            if (rows.next() && rows.getLong(1) > 0) {
                throw new IllegalStateException("Há fornecedores repetidos dentro da mesma empresa; revisar os dados antes de criar o índice multiempresa.");
            }
        }

        try (Statement statement = connection.createStatement()) {
            statement.execute("CREATE UNIQUE INDEX uq_fornecedor_empresa_cnpj ON fornecedor_b2b(empresa_id, cnpj)");
        }
    }
}
