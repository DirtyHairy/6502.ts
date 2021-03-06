BURN_LINES_PAL = 122
SEPARATION = 5

    INCLUDE main.inc

    SEG.U VARS_TEST
    ORG $80

Counter DS.B 1

    SEG CODE_TEST
    ORG $F200

Test1 SUBROUTINE

    CLC
    LDA #12
    STA Counter
    LDA #$A0
    LDX #0
    LDY #02

.loop

    STA HMM0
    STA HMM1

    STX WSYNC
    STX ENAM0
    STX ENAM0
    STX ENAM1
    JSR Delay
    STX RESM0

    STX WSYNC
    STX ENAM0
    STX ENAM0
    STX ENAM1
    JSR Delay
    STX RESM1

    STY WSYNC
    STY HMOVE
    STY ENAM0
    STY ENAM1
    JSR Delay
    NOP
    STY RESM0

    SLEEP 2
    STX ENAM0
    STX ENAM1
    EOR #$80
    ADC #$10
    EOR #$80

    DEC Counter
    BNE .loop

    LDX #SEPARATION
.skipline
    STX WSYNC
    DEX
    BNE .skipline

    RTS

Test2 SUBROUTINE

    CLC
    LDA #12
    STA Counter
    LDA #$A0
    LDX #0
    LDY #02

.loop

    STA HMM0
    STA HMM1

    STX WSYNC
    STX ENAM0
    STX ENAM1
    STX ENAM0
    JSR Delay
    STX RESM0

    STX WSYNC
    STX ENAM0
    STX ENAM1
    STX ENAM0
    JSR Delay
    STX RESM1

    STY WSYNC
    STY HMOVE
    STY ENAM0
    STY ENAM0
    JSR Delay
    NOP
    STY RESM0

    SLEEP 2
    STX ENAM0
    STX ENAM0
    EOR #$80
    ADC #$10
    EOR #$80

    DEC Counter
    BNE .loop

    LDX #SEPARATION
.skipline
    STX WSYNC
    DEX
    BNE .skipline

    RTS

    ORG $FFFC
    .WORD Start
    .WORD Start