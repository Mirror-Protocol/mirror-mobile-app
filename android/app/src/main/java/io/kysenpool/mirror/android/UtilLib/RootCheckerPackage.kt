package io.kysenpool.mirror.android.UtilLib

import android.view.View
import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ReactShadowNode
import com.facebook.react.uimanager.ViewManager
import java.util.*

class RootCheckerPackage : ReactPackage {
    override fun createViewManagers(reactContext: ReactApplicationContext): MutableList<ViewManager<View, ReactShadowNode<*>>> {
        return Collections.emptyList()
    }

    override fun createNativeModules(reactContext: ReactApplicationContext): MutableList<NativeModule> {
        return mutableListOf(RootChecker(reactContext))
    }
}