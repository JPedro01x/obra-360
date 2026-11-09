package br.com.obra360.application.service;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.util.List;

/** Metres, Y vertical, rotation around Y in degrees. Openings use wall-local offset/base. */
public record ModeloDocumento(@Min(1) @Max(2) int schemaVersao,
    @NotNull @Size(min=1,max=50) List<@Valid Pavimento> pavimentos,
    @NotNull @Size(max=2000) List<@Valid Elemento> elementos,
    @Size(max=4000) List<@Valid No> nos,
    @Size(max=500) List<@Valid Cota> cotas,
    @Size(max=500) List<@Valid Ambiente> ambientes) {
    public ModeloDocumento {nos=nos==null?List.of():nos;cotas=cotas==null?List.of():cotas;ambientes=ambientes==null?List.of():ambientes;}
    public ModeloDocumento(int schemaVersao,List<Pavimento> pavimentos,List<Elemento> elementos){this(schemaVersao,pavimentos,elementos,List.of(),List.of(),List.of());}
    public record No(@NotBlank @Pattern(regexp="[A-Za-z0-9_-]{1,64}") String id,@NotBlank String pavimentoId,
        @NotNull @DecimalMin("-10000") @DecimalMax("10000") Double x,@NotNull @DecimalMin("-10000") @DecimalMax("10000") Double z){}
    public record Cota(@NotBlank @Pattern(regexp="[A-Za-z0-9_-]{1,64}") String id,@NotBlank String pavimentoId,
        @NotBlank @Pattern(regexp="ALINHADA|HORIZONTAL|VERTICAL") String tipo,
        @NotNull @DecimalMin("-10000") @DecimalMax("10000") Double ax,@NotNull @DecimalMin("-10000") @DecimalMax("10000") Double az,
        @NotNull @DecimalMin("-10000") @DecimalMax("10000") Double bx,@NotNull @DecimalMin("-10000") @DecimalMax("10000") Double bz,
        @NotNull @DecimalMin("-100") @DecimalMax("100") Double afastamento,@Size(max=64) String noAId,@Size(max=64) String noBId){}
    public record Ambiente(@NotBlank @Pattern(regexp="[A-Za-z0-9_-]{1,64}") String id,@NotBlank String pavimentoId,
        @NotBlank @Size(max=100) String nome,@NotNull @DecimalMin("-10000") @DecimalMax("10000") Double x,
        @NotNull @DecimalMin("-10000") @DecimalMax("10000") Double z,@NotNull @Size(max=200) List<@NotBlank String> paredeIds){}
    public record Pavimento(@NotBlank @Pattern(regexp="[A-Za-z0-9_-]{1,64}") String id,
        @NotBlank @Size(max=100) String nome,
        @NotNull @DecimalMin("-1000") @DecimalMax("10000") Double cota,
        @NotNull @DecimalMin("0.1") @DecimalMax("100") Double altura) {}
    public record Elemento(@NotBlank @Pattern(regexp="[A-Za-z0-9_-]{1,64}") String id,
        @NotBlank String pavimentoId,@NotBlank @Pattern(regexp="PAREDE|LAJE|PILAR|PORTA|JANELA") String tipo,
        @NotBlank @Size(max=100) String nome,
        @NotNull @DecimalMin("-10000") @DecimalMax("10000") Double x,
        @NotNull @DecimalMin("-10000") @DecimalMax("10000") Double z,
        @NotNull @DecimalMin("0") @DecimalMax("100") Double base,
        @NotNull @DecimalMin("0.01") @DecimalMax("1000") Double largura,
        @NotNull @DecimalMin("0.01") @DecimalMax("1000") Double profundidade,
        @NotNull @DecimalMin("0.01") @DecimalMax("100") Double altura,
        @NotNull @DecimalMin("-360") @DecimalMax("360") Double rotacao,
        @NotBlank @Pattern(regexp="#[0-9a-fA-F]{6}") String cor,
        @Size(max=64) String paredeId,
        @NotNull @DecimalMin("-1000") @DecimalMax("1000") Double deslocamento,
        @Size(max=64) String noInicioId,@Size(max=64) String noFimId) {}
}
