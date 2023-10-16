import {
  AlertDialog,
  AlertDialogOverlay,
  AlertDialogContent,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  Button,
} from "@chakra-ui/react";

interface OperationDialogProps {
  destructiveRef: any;
  isOpenDeleteRecord: boolean;
  onCloseDeleteRecord: () => void;
  confirm: Function;
  title: string;
  detail: string;
}

const OperationDialog = ({
  destructiveRef,
  isOpenDeleteRecord,
  onCloseDeleteRecord,
  confirm,
  title,
  detail,
}: OperationDialogProps) => {
  return (
    <AlertDialog
      leastDestructiveRef={destructiveRef}
      isOpen={isOpenDeleteRecord}
      onClose={onCloseDeleteRecord}
    >
      <AlertDialogOverlay>
        <AlertDialogContent>
          <AlertDialogHeader fontSize="lg" fontWeight="bold">
            {title}
          </AlertDialogHeader>

          <AlertDialogBody>{detail}</AlertDialogBody>

          <AlertDialogFooter>
            <Button ref={destructiveRef} onClick={onCloseDeleteRecord}>
              取消
            </Button>
            <Button
              colorScheme="red"
              onClick={() => {
                confirm();
              }}
              ml={3}
            >
              确认
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialogOverlay>
    </AlertDialog>
  );
};

export default OperationDialog;
