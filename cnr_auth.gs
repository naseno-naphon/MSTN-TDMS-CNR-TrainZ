/* +===============================================================================================================================+ */
/* |                                                                                                                               | */
/* |  ███╗   ███╗███████╗████████╗███╗   ██╗    ██████╗ ██████╗  ██████╗ ██████╗ ██╗   ██╗ ██████╗████████╗██╗ ██████╗ ███╗   ██╗  | */
/* |  ████╗ ████║██╔════╝╚══██╔══╝████╗  ██║    ██╔══██╗██╔══██╗██╔═══██╗██╔══██╗██║   ██║██╔════╝╚══██╔══╝██║██╔═══██╗████╗  ██║  | */
/* |  ██╔████╔██║███████╗   ██║   ██╔██╗ ██║    ██████╔╝██████╔╝██║   ██║██║  ██║██║   ██║██║        ██║   ██║██║   ██║██╔██╗ ██║  | */
/* |  ██║╚██╔╝██║╚════██║   ██║   ██║╚██╗██║    ██╔═══╝ ██╔══██╗██║   ██║██║  ██║██║   ██║██║        ██║   ██║██║   ██║██║╚██╗██║  | */
/* |  ██║ ╚═╝ ██║███████║   ██║   ██║ ╚████║    ██║     ██║  ██║╚██████╔╝██████╔╝╚██████╔╝╚██████╗   ██║   ██║╚██████╔╝██║ ╚████║  | */
/* |  ╚═╝     ╚═╝╚══════╝   ╚═╝   ╚═╝  ╚═══╝    ╚═╝     ╚═╝  ╚═╝ ╚═════╝ ╚═════╝  ╚═════╝  ╚═════╝   ╚═╝   ╚═╝ ╚═════╝ ╚═╝  ╚═══╝  | */
/* |																															   | */
/* |                						Copyright 2024-2026 All rights reserved.											   | */
/* |												Made by MSTN Team.                                                             | */
/* +===============================================================================================================================+ */

include "mstn_token_library.gs"
include "cnr_state.gs"

class CNR_AuthHandler {
	public void Verify(CNR_State_Auth authState, Library m_scriptLib) {
		if (m_scriptLib) {
			Asset libAsset = m_scriptLib.GetAsset();
			if (!libAsset) return;

			KUID authLibKuid = libAsset.LookupKUIDTable("auth_lib");
			if (authLibKuid) {
				MSTN_Token_Library lib = cast<MSTN_Token_Library>(World.GetLibrary(authLibKuid));
				if (lib) {
					authState.isVerify = lib.ValidateUser(libAsset);
				}
			}
			
			Soup configSoup = libAsset.GetConfigSoup();
			if (configSoup) {
				Soup extensions = configSoup.GetNamedSoup("extensions");
				if (extensions) {
					Soup mstnScript = extensions.GetNamedSoup("mstn-script");
					if (mstnScript) {
						authState.userName = mstnScript.GetNamedTag("auth-name");
						authState.userEmail = mstnScript.GetNamedTag("auth-email");
						authState.userKey = mstnScript.GetNamedTag("auth-id");
						authState.userPurchaseDate = mstnScript.GetNamedTag("auth-date");
					}
				}
			}
		}
	}
};
