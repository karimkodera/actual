import React from 'react';
import type { ComponentPropsWithoutRef } from 'react';
import { Trans } from 'react-i18next';

import { Button } from '@actual-app/components/button';
import { SvgSaveDisk } from '@actual-app/components/icons/v1';
import { styles } from '@actual-app/components/styles';
import { Text } from '@actual-app/components/text';

type MobileSaveButtonProps = ComponentPropsWithoutRef<typeof Button>;

export function MobileSaveButton({
  onPress,
  style,
  ...props
}: MobileSaveButtonProps) {
  return (
    <Button
      variant="bare"
      style={{
        margin: 10,
        ...style,
      }}
      onPress={onPress}
      {...props}
    >
      <SvgSaveDisk style={{ width: 20, height: 20, marginRight: 5 }} />
      {/*   <Text
        style={{
          ...styles.text,
          fontWeight: 500,
          marginLeft: 5,
          marginRight: 5,
        }}
      >
        <Trans>Save</Trans>
      </Text> */}
    </Button>
  );
}
