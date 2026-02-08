import { useMemo, useState } from 'react';

import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Trans } from '@lingui/react/macro';
import { ChevronsUpDown, PlusIcon, SettingsIcon, UsersIcon } from 'lucide-react';
import { Link } from 'react-router';

import { authClient } from '@documenso/auth/client';
import { useOptionalCurrentOrganisation } from '@documenso/lib/client-only/providers/organisation';
import { useSession } from '@documenso/lib/client-only/providers/session';
import { EXTENDED_ORGANISATION_MEMBER_ROLE_MAP } from '@documenso/lib/constants/organisations-translations';
import { EXTENDED_TEAM_MEMBER_ROLE_MAP } from '@documenso/lib/constants/teams-translations';
import { formatAvatarUrl } from '@documenso/lib/utils/avatars';
import { isAdmin } from '@documenso/lib/utils/is-admin';
import { canExecuteOrganisationAction } from '@documenso/lib/utils/organisations';
import { extractInitials } from '@documenso/lib/utils/recipient-formatter';
import { canExecuteTeamAction } from '@documenso/lib/utils/teams';
import { cn } from '@documenso/ui/lib/utils';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  AvatarWithText,
} from '@documenso/ui/primitives/avatar';
import { Button } from '@documenso/ui/primitives/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@documenso/ui/primitives/dropdown-menu';

import { useOptionalCurrentTeam } from '~/providers/team';

export const OrgMenuSwitcher = () => {
  const { _ } = useLingui();

  const { user, organisations } = useSession();

  const [isOpen, setIsOpen] = useState(false);

  const isUserAdmin = isAdmin(user);

  const currentOrganisation = useOptionalCurrentOrganisation();
  const currentTeam = useOptionalCurrentTeam();

  const allTeams = useMemo(() => {
    return organisations.flatMap((org) =>
      org.teams.map((team) => ({
        ...team,
        organisationUrl: org.url,
        organisationName: org.name,
        currentOrganisationRole: org.currentOrganisationRole,
      })),
    );
  }, [organisations]);

  const firstOrgUrl = organisations[0]?.url;

  const formatAvatarFallback = (name?: string) => {
    if (name !== undefined) {
      return name.slice(0, 1).toUpperCase();
    }

    return user.name ? extractInitials(user.name) : user.email.slice(0, 1).toUpperCase();
  };

  const dropdownMenuAvatarText = useMemo(() => {
    if (currentTeam) {
      return {
        avatarSrc: formatAvatarUrl(currentTeam.avatarImageId),
        avatarFallback: formatAvatarFallback(currentTeam.name),
        primaryText: currentTeam.name,
        secondaryText: _(EXTENDED_TEAM_MEMBER_ROLE_MAP[currentTeam.currentTeamRole]),
      };
    }

    if (currentOrganisation) {
      return {
        avatarSrc: formatAvatarUrl(currentOrganisation.avatarImageId),
        avatarFallback: formatAvatarFallback(currentOrganisation.name),
        primaryText: currentOrganisation.name,
        secondaryText: _(
          EXTENDED_ORGANISATION_MEMBER_ROLE_MAP[currentOrganisation.currentOrganisationRole],
        ),
      };
    }

    return {
      avatarSrc: formatAvatarUrl(user.avatarImageId),
      avatarFallback: formatAvatarFallback(user.name ?? user.email),
      primaryText: user.name,
      secondaryText: _(msg`Personal Account`),
    };
  }, [currentTeam, currentOrganisation, user]);

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          data-testid="menu-switcher"
          variant="none"
          className="relative flex h-12 flex-row items-center px-0 py-2 ring-0 focus:outline-none focus-visible:border-0 focus-visible:ring-0 focus-visible:ring-transparent md:px-2"
        >
          <AvatarWithText
            avatarSrc={dropdownMenuAvatarText.avatarSrc}
            avatarFallback={dropdownMenuAvatarText.avatarFallback}
            primaryText={dropdownMenuAvatarText.primaryText}
            secondaryText={dropdownMenuAvatarText.secondaryText}
            rightSideComponent={
              <ChevronsUpDown className="ml-auto h-4 w-4 text-muted-foreground" />
            }
            textSectionClassName="hidden lg:flex"
          />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        className={cn('z-[60] ml-6 w-full md:ml-0', {
          'min-w-[12rem]': allTeams.length === 0,
          'md:min-w-[32rem]': allTeams.length > 0,
        })}
        align="end"
        forceMount
      >
        <div className="flex">
          {/* Left column: Teams (hidden on mobile if no teams) */}
          {allTeams.length > 0 && (
            <div className="hidden max-h-[20rem] min-w-0 flex-1 overflow-y-auto md:block md:border-r">
              <div className="px-3 py-2">
                <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <UsersIcon className="h-3.5 w-3.5" />
                  <Trans>Teams</Trans>
                </p>
              </div>

              {allTeams.map((team) => (
                <DropdownMenuItem key={team.id} className="group px-3 py-2" asChild>
                  <Link to={`/t/${team.url}`}>
                    <div className="flex w-full items-center gap-2">
                      <Avatar className="h-7 w-7 flex-shrink-0 border border-solid">
                        {team.avatarImageId && (
                          <AvatarImage src={formatAvatarUrl(team.avatarImageId)} />
                        )}
                        <AvatarFallback className="text-xs text-gray-400">
                          {team.name.slice(0, 1).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>

                      <div className="min-w-0 flex-1">
                        <p
                          className={cn('truncate text-sm', {
                            'font-semibold': currentTeam?.id === team.id,
                          })}
                        >
                          {team.name}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {team.organisationName}
                        </p>
                      </div>

                      {canExecuteTeamAction('MANAGE_TEAM', team.currentTeamRole) && (
                        <Link
                          to={`/t/${team.url}/settings`}
                          className="hidden flex-shrink-0 text-muted-foreground opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100 md:block"
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsOpen(false);
                          }}
                        >
                          <SettingsIcon className="h-3.5 w-3.5" />
                        </Link>
                      )}
                    </div>
                  </Link>
                </DropdownMenuItem>
              ))}

              {firstOrgUrl && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="px-3 py-2" asChild>
                    <Link to={`/o/${firstOrgUrl}/settings/teams?action=add-team`}>
                      <PlusIcon className="mr-1.5 h-4 w-4" />
                      <Trans>Create Team</Trans>
                    </Link>
                  </DropdownMenuItem>
                </>
              )}
            </div>
          )}

          {/* Right column: Settings (always visible) */}
          <div className={cn('min-w-[12rem]', { 'md:min-w-[14rem]': allTeams.length > 0 })}>
            {/* Mobile-only: show teams inline */}
            {allTeams.length > 0 && (
              <div className="md:hidden">
                <div className="px-3 py-2">
                  <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                    <UsersIcon className="h-3.5 w-3.5" />
                    <Trans>Teams</Trans>
                  </p>
                </div>

                {allTeams.map((team) => (
                  <DropdownMenuItem key={team.id} className="px-3 py-2" asChild>
                    <Link to={`/t/${team.url}`}>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6 flex-shrink-0 border border-solid">
                          {team.avatarImageId && (
                            <AvatarImage src={formatAvatarUrl(team.avatarImageId)} />
                          )}
                          <AvatarFallback className="text-xs text-gray-400">
                            {team.name.slice(0, 1).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span
                          className={cn('truncate text-sm', {
                            'font-semibold': currentTeam?.id === team.id,
                          })}
                        >
                          {team.name}
                        </span>
                      </div>
                    </Link>
                  </DropdownMenuItem>
                ))}

                <DropdownMenuSeparator />
              </div>
            )}

            {isUserAdmin && (
              <DropdownMenuItem className="px-4 py-2 text-muted-foreground" asChild>
                <Link to="/admin">
                  <Trans>Admin panel</Trans>
                </Link>
              </DropdownMenuItem>
            )}

            {currentOrganisation &&
              canExecuteOrganisationAction(
                'MANAGE_ORGANISATION',
                currentOrganisation.currentOrganisationRole,
              ) && (
                <DropdownMenuItem className="px-4 py-2 text-muted-foreground" asChild>
                  <Link to={`/o/${currentOrganisation.url}/settings`}>
                    <Trans>Organisation settings</Trans>
                  </Link>
                </DropdownMenuItem>
              )}

            {currentTeam && canExecuteTeamAction('MANAGE_TEAM', currentTeam.currentTeamRole) && (
              <DropdownMenuItem className="px-4 py-2 text-muted-foreground" asChild>
                <Link to={`/t/${currentTeam.url}/settings`}>
                  <Trans>Team settings</Trans>
                </Link>
              </DropdownMenuItem>
            )}

            <DropdownMenuItem className="px-4 py-2 text-muted-foreground" asChild>
              <Link to="/inbox">
                <Trans>Personal Inbox</Trans>
              </Link>
            </DropdownMenuItem>

            <DropdownMenuItem className="px-4 py-2 text-muted-foreground" asChild>
              <Link to="/settings/profile">
                <Trans>Account</Trans>
              </Link>
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              className="px-4 py-2 text-destructive/90 hover:!text-destructive"
              onSelect={async () => authClient.signOut()}
            >
              <Trans>Sign Out</Trans>
            </DropdownMenuItem>
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
