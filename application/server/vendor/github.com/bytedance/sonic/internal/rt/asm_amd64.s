// +build !noasm,amd64 !appengine,amd64

#include "go_asm.h"
#include "funcdata.h"
#include "textflag.h"

TEXT ·MoreStack(SB), NOSPLIT, $0 - 8
    NO_LOCAL_POINTERS
_entry:
    MOVQ (TLS), R14
    MOVQ size+0(FP), R12
    NOTQ R12
    LEAQ (SP)(R12*1), R12
    CMPQ R12, 16(R14)
    JBE  _stack_grow
    RET
_stack_grow:
    CALL runtime·morestack_noctxt<>(SB)
    JMP  _entry


TEXT ·StopProf(SB), NOSPLIT, $0-0
    NO_LOCAL_POINTERS
    CMPB github·com∕bytedance∕sonic∕internal∕rt·StopProfiling(SB), $0
    JEQ  _ret_1
    MOVL $1, AX
    LEAQ github·com∕bytedance∕sonic∕internal∕rt·yieldCount(SB), CX
    LOCK
    XADDL AX, (CX)
    MOVL runtime·prof+4(SB), AX
    TESTL AX, AX
    JEQ _ret_1
    MOVL AX, github·com∕bytedance∕sonic∕internal∕rt·oldHz(SB)
    MOVL $0, runtime·prof+4(SB)
_ret_1:
    RET


TEXT ·StartProf(SB), NOSPLIT, $0-0
    NO_LOCAL_POINTERS
    CMPB github·com∕bytedance∕sonic∕internal∕rt·StopProfiling(SB), $0
    JEQ  _ret_2
    MOVL $-1, AX
    LEAQ github·com∕bytedance∕sonic∕internal∕rt·yieldCount(SB), CX
    LOCK
    XADDL AX, (CX)
    CMPL github·com∕bytedance∕sonic∕internal∕rt·yieldCount(SB), $0
    JNE _ret_2
    CMPL runtime·prof+4(SB), $0
    JNE _ret_2
    CMPL github·com∕bytedance∕sonic∕internal∕rt·oldHz(SB), $0
    JNE _branch_1
    MOVL $100, github·com∕bytedance∕sonic∕internal∕rt·oldHz(SB)
_branch_1:
    MOVL github·com∕bytedance∕sonic∕internal∕rt·oldHz(SB), AX
    MOVL AX, runtime·prof+4(SB)
_ret_2:
    RET
    