package com.quanlybanhang;

import static org.junit.jupiter.api.Assertions.assertTrue;

import java.io.Writer;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.sql.Connection;
import java.sql.DatabaseMetaData;
import java.sql.ResultSet;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import javax.sql.DataSource;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

/**
 * Xuất mô tả schema DB ra {@code schema/db-overview.txt} để đồng bộ code với DB thật.
 *
 * <p>Chạy: {@code INTROSPECT_DB=true mvn test -Dtest=DatabaseSchemaIntrospectTest} (PowerShell:
 * {@code $env:INTROSPECT_DB="true"; mvn test -Dtest=DatabaseSchemaIntrospectTest})
 */
@EnabledIfEnvironmentVariable(named = "INTROSPECT_DB", matches = "true")
@SpringBootTest
@ActiveProfiles("dev")
class DatabaseSchemaIntrospectTest {

  @Autowired private DataSource dataSource;

  @Test
  void exportSchemaOverview() throws Exception {
    Path out = Path.of("schema/db-overview.txt");
    Files.createDirectories(out.getParent());
    try (Connection c = dataSource.getConnection();
        Writer w = Files.newBufferedWriter(out, StandardCharsets.UTF_8)) {
      String catalog = c.getCatalog();
      DatabaseMetaData md = c.getMetaData();
      w.write("=== Database ===\n");
      w.write("catalog=" + catalog + "\n");
      w.write(
          "product="
              + md.getDatabaseProductName()
              + " "
              + md.getDatabaseProductVersion()
              + "\n\n");

      List<String> tables = new ArrayList<>();
      try (ResultSet rs = md.getTables(catalog, null, "%", new String[] {"TABLE"})) {
        while (rs.next()) {
          tables.add(rs.getString("TABLE_NAME"));
        }
      }
      Collections.sort(tables);
      assertTrue(!tables.isEmpty(), "Không thấy bảng nào — kiểm tra URL/schema.");

      for (String table : tables) {
        w.write("=== TABLE: " + table + " ===\n");
        try (ResultSet pk = md.getPrimaryKeys(catalog, null, table)) {
          List<String> keys = new ArrayList<>();
          while (pk.next()) {
            keys.add(pk.getString("COLUMN_NAME"));
          }
          if (!keys.isEmpty()) {
            w.write("PRIMARY KEY: " + String.join(", ", keys) + "\n");
          }
        }
        try (ResultSet cols = md.getColumns(catalog, null, table, "%")) {
          while (cols.next()) {
            String col = cols.getString("COLUMN_NAME");
            String type = cols.getString("TYPE_NAME");
            int size = cols.getInt("COLUMN_SIZE");
            String nullable = cols.getString("IS_NULLABLE");
            w.write(
                String.format(
                    "  %-40s %-18s size=%-6s nullable=%s%n", col, type, size, nullable));
          }
        }
        w.write("\n");
      }
      w.flush();
    }
  }
}
