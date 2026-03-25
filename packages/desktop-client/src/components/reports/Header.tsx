import React, { useRef, useState } from 'react';
import type { ComponentProps, ReactNode } from 'react';
import { Trans, useTranslation } from 'react-i18next';

import { Button } from '@actual-app/components/button';
import { useResponsive } from '@actual-app/components/hooks/useResponsive';
import { SvgBolt } from '@actual-app/components/icons/v1';
import { Menu } from '@actual-app/components/menu';
import { Popover } from '@actual-app/components/popover';
import { Select } from '@actual-app/components/select';
import { SpaceBetween } from '@actual-app/components/space-between';
import { theme } from '@actual-app/components/theme';
import { Tooltip } from '@actual-app/components/tooltip';
import { View } from '@actual-app/components/view';

import * as monthUtils from 'loot-core/shared/months';
import type { RuleConditionEntity, TimeFrame } from 'loot-core/types/models';
import type { SyncedPrefs } from 'loot-core/types/prefs';

import { getLiveRange } from './getLiveRange';
import {
  calculateTimeRange,
  getFullRange,
  getLatestRange,
  validateEnd,
  validateStart,
} from './reportRanges';

import { AppliedFilters } from '@desktop-client/components/filters/AppliedFilters';
import { FilterButton } from '@desktop-client/components/filters/FiltersMenu';
import { useLocale } from '@desktop-client/hooks/useLocale';

type HeaderProps = {
  start: TimeFrame['start'];
  end: TimeFrame['end'];
  mode?: TimeFrame['mode'];
  show1Month?: boolean;
  allMonths: Array<{ name: string; pretty: string }>;
  earliestTransaction: string;
  latestTransaction: string;
  firstDayOfWeekIdx?: SyncedPrefs['firstDayOfWeekIdx'];
  onChangeDates: (
    start: TimeFrame['start'],
    end: TimeFrame['end'],
    mode: TimeFrame['mode'],
  ) => void;
  children?: ReactNode;
  inlineContent?: ReactNode;
  filterExclude?: string[];
} & (
  | {
      filters: RuleConditionEntity[];
      onApply: (conditions: RuleConditionEntity) => void;
      onUpdateFilter: ComponentProps<typeof AppliedFilters>['onUpdate'];
      onDeleteFilter: ComponentProps<typeof AppliedFilters>['onDelete'];
      conditionsOp: 'and' | 'or';
      onConditionsOpChange: ComponentProps<
        typeof AppliedFilters
      >['onConditionsOpChange'];
    }
  | {
      filters?: never;
      onApply?: never;
      onUpdateFilter?: never;
      onDeleteFilter?: never;
      conditionsOp?: never;
      onConditionsOpChange?: never;
    }
);

export function Header({
  start,
  end,
  mode,
  show1Month,
  allMonths,
  earliestTransaction,
  latestTransaction,
  firstDayOfWeekIdx,
  onChangeDates,
  filters,
  conditionsOp,
  onApply,
  onUpdateFilter,
  onDeleteFilter,
  onConditionsOpChange,
  children,
  inlineContent,
  filterExclude,
}: HeaderProps) {
  const locale = useLocale();
  const { t } = useTranslation();
  const { isNarrowWidth } = useResponsive();

  const customPopoverRef = useRef<HTMLButtonElement | null>(null);
  const [isCustomOpen, setIsCustomOpen] = useState(false);

  const settingsPopoverRef = useRef<HTMLButtonElement | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  function convertToMonth(
    start: string,
    end: string,
    _: TimeFrame['mode'],
    mode: TimeFrame['mode'],
  ): [string, string, TimeFrame['mode']] {
    return [monthUtils.getMonth(start), monthUtils.getMonth(end), mode];
  }

  const dateSelects = (
    <SpaceBetween gap={5}>
      <Select
        onChange={newValue =>
          onChangeDates(
            ...validateStart(
              allMonths[allMonths.length - 1].name,
              allMonths[0].name,
              newValue,
              end,
            ),
          )
        }
        value={start}
        defaultLabel={monthUtils.format(start, 'MMMM yyyy', locale)}
        options={allMonths.map(({ name, pretty }) => [name, pretty])}
      />
      <View>{t('to')}</View>
      <Select
        onChange={newValue =>
          onChangeDates(
            ...validateEnd(
              allMonths[allMonths.length - 1].name,
              allMonths[0].name,
              start,
              newValue,
            ),
          )
        }
        value={end}
        options={allMonths.map(({ name, pretty }) => [name, pretty])}
        style={{ marginRight: 10 }}
      />
    </SpaceBetween>
  );

  const modeToggleTriggerRef = useRef<HTMLButtonElement | null>(null);
  const [isModeMenuOpen, setIsModeMenuOpen] = useState(false);

  const modeToggle = mode && (
    <Tooltip
      content={
        mode === 'static'
          ? t('Date range is fixed and does not change over time')
          : t('Date range shifts automatically as time passes')
      }
    >
      <Button
        variant={isNarrowWidth ? 'bare' : 'primary'}
        onPress={() => {
          const newMode = mode === 'static' ? 'sliding-window' : 'static';
          const [newStart, newEnd] = calculateTimeRange({
            start,
            end,
            mode: newMode,
          });
          onChangeDates(newStart, newEnd, newMode);
        }}
        aria-label={mode === 'static' ? t('Static') : t('Live')}
      >
        {isNarrowWidth ? (
          <SvgBolt
            style={{
              width: '1em',
              height: '1em',
              color:
                mode === 'static'
                  ? theme.buttonNormalDisabledText
                  : theme.buttonPrimaryBackground,
            }}
          />
        ) : (
          <span>{mode === 'static' ? t('Static') : t('Live')}</span>
        )}
      </Button>
    </Tooltip>
  );

  const customButton = (
    <>
      <Button
        ref={customPopoverRef}
        variant="bare"
        onPress={() => setIsCustomOpen(true)}
        aria-label={t('Custom date range')}
      >
        <SpaceBetween gap={3} style={{ alignItems: 'center' }}>
          <Trans>CUSTOM</Trans>
          <svg
            width="8"
            height="5"
            viewBox="0 0 8 5"
            fill="currentColor"
            style={{ display: 'block', flexShrink: 0 }}
          >
            <path d="M0 0h8L4 5z" />
          </svg>
        </SpaceBetween>
      </Button>
      <Popover
        triggerRef={customPopoverRef}
        isOpen={isCustomOpen}
        onOpenChange={setIsCustomOpen}
        placement="bottom start"
      >
        <View style={{ padding: 10 }}>{dateSelects}</View>
      </Popover>
    </>
  );

  const settingsButton = children && (
    <>
      <Button
        ref={settingsPopoverRef}
        variant="bare"
        onPress={() => setIsSettingsOpen(true)}
        aria-label={t('Settings')}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ display: 'block' }}
        >
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      </Button>
      <Popover
        triggerRef={settingsPopoverRef}
        isOpen={isSettingsOpen}
        onOpenChange={setIsSettingsOpen}
        placement="bottom end"
      >
        <View style={{ padding: 10 }}>{children}</View>
      </Popover>
    </>
  );

  const shortcutButtons = (
    <SpaceBetween gap={3}>
      {show1Month && (
        <Tooltip content={t('1 month')}>
          <Button
            variant="bare"
            onPress={() => onChangeDates(...getLatestRange(0))}
          >
            <Trans>1M</Trans>
          </Button>
        </Tooltip>
      )}
      <Tooltip content={t('3 months')}>
        <Button
          variant="bare"
          onPress={() => onChangeDates(...getLatestRange(2))}
        >
          <Trans>3M</Trans>
        </Button>
      </Tooltip>
      <Tooltip content={t('6 months')}>
        <Button
          variant="bare"
          onPress={() => onChangeDates(...getLatestRange(5))}
        >
          <Trans>6M</Trans>
        </Button>
      </Tooltip>
      <Tooltip content={t('1 year')}>
        <Button
          variant="bare"
          onPress={() => onChangeDates(...getLatestRange(11))}
        >
          <Trans>1Y</Trans>
        </Button>
      </Tooltip>
      <Tooltip content={t('Year to date')}>
        <Button
          variant="bare"
          onPress={() =>
            onChangeDates(
              ...convertToMonth(
                ...getLiveRange(
                  'Year to date',
                  earliestTransaction,
                  latestTransaction,
                  true,
                  firstDayOfWeekIdx,
                ),
                'yearToDate',
              ),
            )
          }
        >
          <Trans>YTD</Trans>
        </Button>
      </Tooltip>
      <Tooltip content={t('Last month')}>
        <Button
          variant="bare"
          onPress={() =>
            onChangeDates(
              ...convertToMonth(
                ...getLiveRange(
                  'Last month',
                  earliestTransaction,
                  latestTransaction,
                  false,
                  firstDayOfWeekIdx,
                ),
                'lastMonth',
              ),
            )
          }
        >
          <Trans>LM</Trans>
        </Button>
      </Tooltip>
      <Tooltip content={t('Last year')}>
        <Button
          variant="bare"
          onPress={() =>
            onChangeDates(
              ...convertToMonth(
                ...getLiveRange(
                  'Last year',
                  earliestTransaction,
                  latestTransaction,
                  false,
                  firstDayOfWeekIdx,
                ),
                'lastYear',
              ),
            )
          }
        >
          <Trans>LY</Trans>
        </Button>
      </Tooltip>
      <Tooltip content={t('Prior year to date')}>
        <Button
          variant="bare"
          onPress={() =>
            onChangeDates(
              ...convertToMonth(
                ...getLiveRange(
                  'Prior year to date',
                  earliestTransaction,
                  latestTransaction,
                  false,
                  firstDayOfWeekIdx,
                ),
                'priorYearToDate',
              ),
            )
          }
        >
          <Trans>PYTD</Trans>
        </Button>
      </Tooltip>
      <Tooltip content={t('All time')}>
        <Button
          variant="bare"
          onPress={() =>
            onChangeDates(
              ...getFullRange(
                allMonths[allMonths.length - 1].name,
                allMonths[0].name,
              ),
            )
          }
        >
          <Trans>ALL</Trans>
        </Button>
      </Tooltip>

      {filters && (
        <FilterButton
          compact={isNarrowWidth}
          onApply={onApply}
          hover={false}
          exclude={filterExclude}
        />
      )}
      {inlineContent}
    </SpaceBetween>
  );

  return (
    <View
      style={{
        padding: 10,
        paddingTop: 15,
        flexShrink: 0,
      }}
    >
      {isNarrowWidth ? (
        // Mobile layout
        <View
          style={{
            display: 'flex',
            flexDirection: 'column',
            flex: 1,
          }}
        >
          {/* Single row: modeToggle | CUSTOM | shortcuts | ... | ⚙ */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 4,
            }}
          >
            <SpaceBetween gap={3}>
              {modeToggle}
              {customButton}
            </SpaceBetween>
            {shortcutButtons}
            <View style={{ marginLeft: 'auto' }}>{settingsButton}</View>
          </View>
        </View>
      ) : (
        // Desktop: completely unchanged
        <View
          style={{
            display: 'grid',
            alignItems: 'center',
          }}
        >
          <View
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              flexDirection: 'row',
            }}
          >
            <SpaceBetween gap={undefined}>
              {modeToggle}
              {dateSelects}
            </SpaceBetween>

            <SpaceBetween gap={3}>{shortcutButtons}</SpaceBetween>
          </View>

          {children && (
            <View
              style={{
                gridColumn: 2,
                flexDirection: 'row',
                justifySelf: 'flex-end',
                alignSelf: 'flex-start',
              }}
            >
              {children}
            </View>
          )}
        </View>
      )}

      {filters && filters.length > 0 && (
        <View style={{ marginTop: 5 }}>
          <AppliedFilters
            conditions={filters}
            onUpdate={onUpdateFilter}
            onDelete={onDeleteFilter}
            conditionsOp={conditionsOp}
            onConditionsOpChange={onConditionsOpChange}
          />
        </View>
      )}
    </View>
  );
}
