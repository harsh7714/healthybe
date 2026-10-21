import Heading from '@components/Heading'
import { useProfileSettings } from '../hooks/useProfileSettings'
import SignInPrompt from './SignInPrompt'
import FamilyProfilesSection from './FamilyProfilesSection'
import AppearanceSection from './AppearanceSection'
import SavedChatsSection from './SavedChatsSection'
import AccountSecuritySection from './AccountSecuritySection'

export default function ProfileSettings() {
  const settings = useProfileSettings()
  const {
    user,
    members,
    activeId,
    dark,
    setDark,
    name,
    setName,
    relation,
    setRelation,
    error,
    busy,
    chatNotice,
  } = settings

  return (
    <>
      <Heading
        eyebrow="Account & preferences"
        title="Profile & settings"
        text="Manage one account and private health spaces for each family member."
      />
      {!user && <SignInPrompt />}
      <div className="profile-grid">
        <FamilyProfilesSection
          {...{ members, user, activeId, name, setName, relation, setRelation, error, busy }}
          onAdd={settings.add}
          onRemove={settings.remove}
        />
        <AppearanceSection dark={dark} setDark={setDark} />
      </div>
      <SavedChatsSection onClear={settings.clearChats} notice={chatNotice} />
      {user && <AccountSecuritySection user={user} />}
    </>
  )
}
